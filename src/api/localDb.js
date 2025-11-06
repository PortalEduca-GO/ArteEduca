// Local Database usando IndexedDB para desenvolvimento
const DB_NAME = 'ArteEducaDB';
const DB_VERSION = 1;

let db = null;

// Inicializar o banco de dados
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Criar object stores se não existirem
      const stores = ['forms', 'submissions', 'users', 'projetos', 'termos', 'escolas', 'declaracoes'];
      
      stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
          objectStore.createIndex('created_date', 'created_date', { unique: false });
        }
      });
    };
  });
};

// Garantir que o DB está inicializado
const ensureDB = async () => {
  if (!db) {
    await initDB();
  }
  return db;
};

// Gerar ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Operações genéricas de CRUD
class LocalEntity {
  constructor(storeName) {
    this.storeName = storeName;
  }

  async list(orderBy = '-created_date') {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        let items = request.result;
        
        // Ordenar se necessário
        if (orderBy) {
          const isDescending = orderBy.startsWith('-');
          const field = isDescending ? orderBy.substring(1) : orderBy;
          
          items.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal < bVal) return isDescending ? 1 : -1;
            if (aVal > bVal) return isDescending ? -1 : 1;
            return 0;
          });
        }
        
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get(id) {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async create(data) {
    const db = await ensureDB();
    const newItem = {
      ...data,
      id: data.id || generateId(),
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.add(newItem);

      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  }

  async update(id, data) {
    const db = await ensureDB();
    const existing = await this.get(id);
    
    if (!existing) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      id: existing.id,
      created_date: existing.created_date,
      updated_date: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id) {
    const db = await ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Excluir múltiplos itens pelo array de ids
   * Retorna uma Promise que resolve com um objeto { deleted: number, failed: number }
   */
  async bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deleted: 0, failed: 0 };
    }

    const db = await ensureDB();
    let deleted = 0;
    let failed = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      ids.forEach((id) => {
        try {
          const req = objectStore.delete(id);
          req.onsuccess = () => { deleted += 1; };
          req.onerror = () => { failed += 1; };
        } catch (err) {
          failed += 1;
        }
      });

      transaction.oncomplete = () => resolve({ deleted, failed });
      transaction.onerror = () => reject(transaction.error || new Error('bulkDelete transaction failed'));
    });
  }

  async bulkCreate(items) {
    const db = await ensureDB();
    const results = [];
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      
      items.forEach(item => {
        const newItem = {
          ...item,
          id: item.id || generateId(),
          created_date: item.created_date || new Date().toISOString(),
          updated_date: new Date().toISOString()
        };
        
        const request = objectStore.add(newItem);
        request.onsuccess = () => results.push(newItem);
      });

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Filtrar itens baseado em critérios
  async filter(filterQuery = {}, orderBy = '-created_date') {
    const allItems = await this.list(orderBy);
    
    // Se não há filtros, retornar tudo
    if (Object.keys(filterQuery).length === 0) {
      return allItems;
    }
    
    // Função auxiliar para verificar se um valor corresponde ao filtro
    const matchesFilter = (item, key, value) => {
      // Suportar notação de ponto (ex: 'identificacao.cre')
      const keys = key.split('.');
      let currentValue = item;
      
      for (const k of keys) {
        if (currentValue === null || currentValue === undefined) {
          return false;
        }
        currentValue = currentValue[k];
      }
      
      // Se o valor é um objeto com operadores especiais
      if (typeof value === 'object' && value !== null) {
        // Operador $ne (not equal)
        if ('$ne' in value) {
          return currentValue !== value.$ne;
        }
        // Operador $in (in array)
        if ('$in' in value) {
          return Array.isArray(value.$in) && value.$in.includes(currentValue);
        }
        // Operador $gt (greater than)
        if ('$gt' in value) {
          return currentValue > value.$gt;
        }
        // Operador $lt (less than)
        if ('$lt' in value) {
          return currentValue < value.$lt;
        }
        // Operador $regex (regex match)
        if ('$regex' in value) {
          const regex = new RegExp(value.$regex, value.$options || '');
          return regex.test(String(currentValue));
        }
      }
      
      // Comparação simples
      return currentValue === value;
    };
    
    // Filtrar itens
    return allItems.filter(item => {
      return Object.entries(filterQuery).every(([key, value]) => {
        return matchesFilter(item, key, value);
      });
    });
  }

  // Retornar schema genérico para o formulário
  schema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        fields: { type: 'array' },
        isActive: { type: 'boolean' },
        settings: { type: 'object' },
        styling: { type: 'object' }
      }
    };
  }
}

// Classe especial para User com métodos de autenticação
class LocalUserEntity extends LocalEntity {
  constructor() {
    super('users');
    this.currentUser = null;
  }

  normalizeUser(user = {}, existing = {}) {
    const combined = { ...existing, ...user };
    const appRole = combined.app_role || combined.appRole || combined.role || 'professor';
    const fullName = combined.full_name || combined.fullName || combined.name || '';
    const rawAvailableRoles = combined.available_roles || combined.availableRoles;
    const persistedAdminFlag = combined.is_admin_account ?? combined.isAdminAccount;
    const hadAdminRole = Array.isArray(rawAvailableRoles) && rawAvailableRoles.includes('admin');
    const isAdminAccount = persistedAdminFlag !== undefined
      ? Boolean(persistedAdminFlag)
      : (appRole === 'admin' || combined.id === 'user-admin-001' || combined.email === 'admin@adm' || hadAdminRole);

    let availableRoles = rawAvailableRoles;
    if (!Array.isArray(availableRoles) || availableRoles.length === 0) {
      availableRoles = isAdminAccount
        ? ['admin', 'gestor', 'articulador', 'professor']
        : [appRole];
    }

    if (isAdminAccount) {
      availableRoles = ['admin', 'gestor', 'articulador', 'professor'];
    } else {
      const allowedNonAdminRoles = ['gestor', 'articulador', 'professor'];
      availableRoles = Array.from(new Set(
        availableRoles.filter((role) => allowedNonAdminRoles.includes(role))
      ));

      if (appRole && !availableRoles.includes(appRole)) {
        availableRoles.push(appRole);
      }
    }

    return {
      ...combined,
      app_role: appRole,
      role: appRole,
      full_name: fullName,
      name: combined.name || fullName,
      available_roles: availableRoles,
      is_admin_account: isAdminAccount,
    };
  }

  async list(orderBy = '-created_date') {
    const users = await super.list(orderBy);
    return users.map((user) => this.normalizeUser(user));
  }

  async get(id) {
    const user = await super.get(id);
    return this.normalizeUser(user);
  }

  async create(data) {
    const normalized = this.normalizeUser(data);
    const created = await super.create(normalized);
    return this.normalizeUser(created);
  }

  async update(id, data) {
    const existing = await super.get(id);
    const normalized = this.normalizeUser(data, existing || {});
    const updated = await super.update(id, normalized);
    return this.normalizeUser(updated);
  }

  async me() {
    // Retornar usuário atual da sessão ou criar um usuário padrão
    if (this.currentUser) {
      this.currentUser = this.normalizeUser(this.currentUser);
      return this.currentUser;
    }

    // Verificar se existe usuário no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const normalized = this.normalizeUser(JSON.parse(savedUser));
      this.currentUser = normalized;
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      return normalized;
    }

    // Criar usuário padrão para desenvolvimento APENAS se não existir nenhum usuário
    const allUsers = await super.list();
    
    if (allUsers.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      
      const defaultUser = this.normalizeUser({
        id: 'user-dev-001',
        full_name: 'Administrador',
        email: 'admin@adm',
        password: hashedPassword,
        app_role: 'admin',
        cpf: '000.000.000-00',
        cre: 'CRE 01',
        municipio: 'Goiânia',
        unidadeEducacional: 'Escola Teste',
        inep: '00000000',
        created_date: new Date().toISOString()
      });

      this.currentUser = defaultUser;
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    
      // Salvar no banco de dados se não existir
      try {
        const existing = await this.get(defaultUser.id);
        if (!existing) {
          await this.create(defaultUser);
        }
      } catch (error) {
        await this.create(defaultUser);
      }

      return defaultUser;
    }
    
    // Se não há usuário autenticado e há usuários no banco, não criar usuário padrão
    return null;
  }

  async updateMyUserData(data) {
    const currentUser = await this.me();
    const updated = await this.update(currentUser.id, data);

    this.currentUser = this.normalizeUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

    return this.currentUser;
  }

  async loginWithRedirect(callbackUrl) {
    console.log('Login simulado - modo desenvolvimento');
    return this.me();
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    return { success: true };
  }

  // Garantir que existe pelo menos um usuário admin com credenciais conhecidas
  async ensureAdminUser() {
    const adminEmail = 'admin@adm';
    const adminId = 'user-admin-001';
    const allUsers = await super.list();

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);

    let existingAdmin = allUsers.find((user) => user?.email?.toLowerCase() === adminEmail);

    if (!existingAdmin) {
      existingAdmin = allUsers.find((user) => user?.id === adminId);
    }

    if (!existingAdmin) {
      existingAdmin = allUsers.find((user) => user?.app_role === 'admin' || user?.role === 'admin');
    }

    if (!existingAdmin) {
      const adminUser = {
        id: adminId,
        full_name: 'Administrador',
        email: adminEmail,
        password: hashedPassword,
        app_role: 'admin',
        role: 'admin',
        name: 'Administrador',
        available_roles: ['admin', 'gestor', 'articulador', 'professor'],
        is_admin_account: true,
        cpf: '000.000.000-00',
        cre: 'CRE 01',
        municipio: 'Goiânia',
        unidadeEducacional: 'Escola Administrativa',
        inep: '00000001',
        created_date: new Date().toISOString()
      };

      try {
        const created = await super.create(adminUser);
        console.log('✅ Usuário admin criado: admin@adm / admin123');
        existingAdmin = created;
      } catch (error) {
        if (error?.name === 'ConstraintError') {
          console.warn('⚠️ Registro admin já existia; atualizando dados do usuário padrão.');
          existingAdmin = await super.get(adminId).catch(() => null);

          if (!existingAdmin) {
            const refreshedUsers = await super.list();
            existingAdmin = refreshedUsers.find((user) =>
              user?.email?.toLowerCase() === adminEmail
              || user?.app_role === 'admin'
              || user?.role === 'admin'
            );
          }
        } else {
          throw error;
        }
      }
    }

    if (!existingAdmin) {
      throw new Error('Não foi possível garantir a conta administrativa padrão.');
    }

    const passwordValue = existingAdmin.password || '';
    const isBcryptHash = typeof passwordValue === 'string' && /^\$2[abxy]\$/.test(passwordValue);
    const mustResetPassword = !isBcryptHash;

    const updatePayload = {
      email: adminEmail,
      app_role: 'admin',
      role: 'admin',
      full_name: existingAdmin.full_name || existingAdmin.name || 'Administrador',
      name: existingAdmin.name || existingAdmin.full_name || 'Administrador',
      available_roles: ['admin', 'gestor', 'articulador', 'professor'],
      is_admin_account: true,
    };

    if (mustResetPassword) {
      updatePayload.password = hashedPassword;
      console.log('♻️ Senha do admin redefinida para admin123');
    }

    const updated = await super.update(existingAdmin.id || adminId, updatePayload);
    console.log('🔄 Conta admin verificada e atualizada.');

    return this.normalizeUser(updated);
  }
}

// Exportar instâncias das entidades
export const LocalForm = new LocalEntity('forms');
export const LocalSubmission = new LocalEntity('submissions');
export const LocalProjetoArteEduca = new LocalEntity('projetos');
export const LocalTermoDeCompromisso = new LocalEntity('termos');
export const LocalEscola = new LocalEntity('escolas');
export const LocalDeclaracaoCre = new LocalEntity('declaracoes');

// Exportar instância do User
export const LocalUser = new LocalUserEntity();

// Inicializar o banco ao carregar o módulo e garantir usuário admin
const initializeDatabase = async () => {
  try {
    await initDB();
    await LocalUser.ensureAdminUser();
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
};

initializeDatabase();

// Função para popular dados de exemplo (opcional)
export const seedDatabase = async () => {
  try {
    await ensureDB();
    
    // Verificar se já existem dados
    const forms = await LocalForm.list();
    if (forms.length > 0) {
      console.log('Banco de dados já contém dados');
      return;
    }

    // Criar um formulário de exemplo
    const exampleForm = await LocalForm.create({
      title: 'Formulário de Exemplo',
      description: 'Este é um formulário de teste criado automaticamente',
      fields: [
        {
          id: 'field1',
          type: 'text',
          label: 'Nome',
          required: true
        },
        {
          id: 'field2',
          type: 'email',
          label: 'Email',
          required: true
        },
        {
          id: 'field3',
          type: 'textarea',
          label: 'Mensagem',
          required: false
        }
      ],
      isActive: true,
      settings: {
        isPublic: true
      },
      styling: {
        backgroundColor: '#f0f0f0'
      }
    });

    // Criar uma submissão de exemplo
    await LocalSubmission.create({
      formId: exampleForm.id,
      data: {
        field1: 'João Silva',
        field2: 'joao@example.com',
        field3: 'Esta é uma mensagem de teste'
      },
      submitterName: 'João Silva',
      submitterEmail: 'joao@example.com'
    });

    console.log('Banco de dados populado com dados de exemplo');
  } catch (error) {
    console.error('Erro ao popular banco de dados:', error);
  }
};
