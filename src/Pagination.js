const _ = require('lodash');
const { Types: { ObjectId } } = require('mongoose');

/**
 * @author: Tinh Tran
 */
class Pagination {
/**
   *
   * @param {Model} Model mongoose model.
   * @param {object} criteria query criteria.
   * @param {object} pagination limit and  cursor.
   * @param {object} sort the sort parameters.
   * @param {Array} sort.fields the sort field name.
   * @param {object} sort.order order. Either 1/-1 or asc/desc.
   * @param {String || Array} select fields to return
   * @param {object} options Additional limit (min,max).
   */
  constructor(Model, { criteria = {}, pagination = {}, sort = {}, select, options = {} }) {
    this.Model = Model;
    this.criteria = criteria;
    const { limit, cursor, skip } = pagination;
    this.skip = skip || 0;
    this.sort = sort;
    this.cursor = cursor;
    this.select = select;
    this.isSortId = true;
    this.getSort(sort);
    this.getLimit(limit, options);
  }

  getSort(sort) {
    let { fields, order } = { ...sort };
    order = order || 'asc';
    fields = _.union(fields || [], ['_id']);

    if (order === 'asc') {
      order = 1;
    } else {
      order = -1;
    }

    this.key = order === 1 ? '$gt' : '$lt';
    this.sort = { fields, order };

    if (fields.length === 1) {
      this.sortFields = { _id: order };
    } else {
      this.isSortId = false;
      fields.forEach(field => {
        this.sortFields = { ...this.sortFields, [field]: order };
      });
    }
  }

  getLimit(limit, options = { def: 10, max: 200 }) {
    const { def, max } = { def: 10, max: 200, ...options };
    let value = parseInt(limit, 10);
    if (!value || value < 1) {
      value = def;
    } if (value > max) {
      value = max;
    }
    this.limit = value;
  }

  /**
   * Gets the select field
   * @private
   * @returns
   */

  getSelectFields() {
    const { fields } = this.sort;
    let selectFields = this.select;

    if (this.isSortId) {
      return selectFields;
    }

    if (typeof selectFields === 'string') {
      selectFields = selectFields.split(' ');
    }

    return _.union(selectFields, fields);
  }

  /**
   *
   * @param {String} cursorFields
   * @returns the filter cursor
   */

  getCriteriaCursor(cursorFields) {
    const { fields } = this.sort;
    const cursor = JSON.parse(Buffer.from(cursorFields, 'base64').toString('utf8'));

    const criteria = { _id: { [this.key]: new ObjectId(cursor._id) } };

    if (this.isSortId) {
      return [criteria];
    }

    const omitFields = fields.filter(field => field !== '_id');
    const criteriaCursor = [];

    omitFields.forEach(field => {
      const isSchemaTypeDate = this.Model.schema.path(`${field}`).instance === 'Date';

      criteria[field] = isSchemaTypeDate ? Date.parse(cursor[field]) : cursor[field];
      criteriaCursor.push({ [field]: { [this.key]: isSchemaTypeDate ? Date.parse(cursor[field]) : cursor[field] } });
    });

    criteriaCursor.push(criteria);

    return criteriaCursor;
  }

  /**
   * Gets the criteria.
   * @private
   * @returns the filter
   */

  getCriteria() {
    const filter = { ...this.criteria };

    if (this.skip) {
      return filter;
    }

    if (this.cursor) {
      const criteriaCursor = this.getCriteriaCursor(this.cursor);

      if (!filter?.$or) {
        return { ...filter, $or: criteriaCursor };
      }

      filter.$and = [{ $or: filter.$or }, { $or: criteriaCursor }];
      delete filter.$or;
    }

    return filter;
  }

  /**
   *Gets the number total docs
   *
   * @returns the total number of documents found based criteria
   */
  async getTotalDocs() {
    const count = await this.Model.countDocuments(this.criteria);
    return count;
  }

  /**
   *Gets the array value fields
   *
   * @returns the array value fields of documents found based criteria
   */
  async getListValueField(field) {
    const query = await this.Model.distinct(field, this.criteria);
    return query;
  }

  /**
   *
   * @returns the list documents found based criteria
   */
  async getDocs() {
    const criteria = this.getCriteria();

    const docs = await this.Model.find(criteria)
      .sort(this.sortFields)
      .skip(this.skip)
      .limit(this.limit)
      .select(this.getSelectFields())
      .lean();

    this.docs = docs;
    return docs;
  }

  /**
   * Gets the cursor
   *
   * @returns string format base64
   */

  getCursor() {
    const { docs } = this;
    const { fields } = this.sort;

    if (!docs || !docs.length) {
      return null;
    }

    let cursorFields = {};
    const lastDocs = docs[docs.length - 1];

    if (this.isSortId) {
      cursorFields = { _id: lastDocs._id };
    } else {
      fields.forEach(field => {
        cursorFields = { ...cursorFields, [field]: lastDocs[field] };
      });
    }

    return Buffer.from(JSON.stringify(cursorFields)).toString('base64');
  }
}

module.exports = Pagination;
