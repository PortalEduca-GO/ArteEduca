import httpClient from './httpClient';

const sortItems = (items, orderBy) => {
  if (!orderBy) {
    return items;
  }

  const isDescending = orderBy.startsWith('-');
  const field = isDescending ? orderBy.slice(1) : orderBy;

  return [...items].sort((a, b) => {
    const aVal = a?.[field];
    const bVal = b?.[field];

    if (aVal === bVal) {
      return 0;
    }

    const compare = aVal < bVal ? -1 : 1;
    return isDescending ? -compare : compare;
  });
};

const matchesFilter = (item, key, value) => {
  const parts = key.split('.');
  let current = item;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return false;
    }
    current = current[part];
  }

  if (typeof value === 'object' && value !== null) {
    if (value.$ne !== undefined) {
      return current !== value.$ne;
    }
    if (value.$in !== undefined) {
      return Array.isArray(value.$in) && value.$in.includes(current);
    }
    if (value.$gt !== undefined) {
      return current > value.$gt;
    }
    if (value.$lt !== undefined) {
      return current < value.$lt;
    }
    if (value.$regex !== undefined) {
      const regex = new RegExp(value.$regex, value.$options || '');
      return regex.test(String(current));
    }
  }

  return current === value;
};

export class RemoteEntity {
  constructor({ resource, normalize = (item) => item, serialize = (item) => item }) {
    this.resource = resource;
    this.normalize = normalize;
    this.serialize = serialize;
  }

  async list(orderBy) {
    const data = await httpClient.get(`/${this.resource}`);
    const normalized = Array.isArray(data) ? data.map(this.normalize) : [];
    return sortItems(normalized, orderBy);
  }

  async get(id) {
    if (!id) {
      throw new Error('ID é obrigatório para buscar um registro');
    }
    const data = await httpClient.get(`/${this.resource}/${id}`);
    return this.normalize(data);
  }

  async create(payload) {
    const body = this.serialize(payload);
    const data = await httpClient.post(`/${this.resource}`, body);
    return this.normalize(data);
  }

  async update(id, payload) {
    if (!id) {
      throw new Error('ID é obrigatório para atualização');
    }
    const body = this.serialize(payload);
    const data = await httpClient.put(`/${this.resource}/${id}`, body);
    return this.normalize(data);
  }

  async delete(id) {
    if (!id) {
      throw new Error('ID é obrigatório para exclusão');
    }
    await httpClient.delete(`/${this.resource}/${id}`);
    return { success: true };
  }

  async bulkCreate(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }
    const payload = items.map(this.serialize);
    const data = await httpClient.post(`/${this.resource}/bulk`, payload);
    return data;
  }

  async bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deleted: 0, failed: 0 };
    }
    const result = await httpClient.post(`/${this.resource}/bulk-delete`, { ids });
    return result;
  }

  async filter(filterQuery = {}, orderBy) {
    const items = await this.list(orderBy);

    if (Object.keys(filterQuery).length === 0) {
      return items;
    }

    return items.filter((item) => (
      Object.entries(filterQuery).every(([key, value]) => matchesFilter(item, key, value))
    ));
  }
}

export default RemoteEntity;
