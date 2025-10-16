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

  async me() {
    // Retornar usuário atual da sessão ou criar um usuário padrão
    if (this.currentUser) {
      return this.currentUser;
    }

    // Verificar se existe usuário no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      return this.currentUser;
    }

    // Criar usuário padrão para desenvolvimento
    const defaultUser = {
      id: 'user-dev-001',
      name: 'Usuário Desenvolvimento',
      email: 'dev@localhost.com',
      app_role: 'admin',
      cpf: '000.000.000-00',
      cre: 'CRE 01',
      municipio: 'Rio de Janeiro',
      unidadeEducacional: 'Escola Teste',
      inep: '00000000',
      created_date: new Date().toISOString()
    };

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

  async updateMyUserData(data) {
    const currentUser = await this.me();
    const updated = { ...currentUser, ...data };
    
    this.currentUser = updated;
    localStorage.setItem('currentUser', JSON.stringify(updated));
    
    return await this.update(currentUser.id, updated);
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

// Inicializar o banco ao carregar o módulo
initDB().catch(console.error);

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
