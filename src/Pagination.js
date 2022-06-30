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
   * @param {object} sort.field the sort field name.
   * @param {object} sort.order order. Either 1/-1 or asc/desc.
   * @param {object} select fields to return
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
    let { field, order } = { ...sort };
    order = order || 'asc';
    field = field || '_id';

    if (order === 'asc') {
      order = 1;
    } else {
      order = -1;
    }

    this.op = order === 1 ? '$gt' : '$lt';
    this.sort = { field, order };

    switch (field) {
      case '_id':
        this.sortValue = { _id: order };
        break;

      default:
        this.isSortId = false;
        this.sortValue = { [field]: order, _id: order };
        break;
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
    const { field } = this.sort;
    let selectFields = this.select;

    if (this.isSortId) {
      return selectFields;
    }

    if (typeof selectFields === 'string') {
      selectFields = selectFields.split(' ');
    }

    return _.union(selectFields, [field]);
  }

  /**
   *
   * @param {String} cursorFields
   * @returns the filter cursor
   */

  getCriteriaCursor(cursorFields) {
    const { field } = this.sort;

    const cursor = JSON.parse(Buffer.from(cursorFields, 'base64').toString('utf8'));

    if (this.isSortId) {
      return [{ _id: { [this.op]: new ObjectId(cursor._id) } }];
    }

    const isTypeDate = this.Model.schema.path(`${field}`).instance === 'Date';

    return [
      { [field]: { [this.op]: isTypeDate ? Date.parse(cursor[field]) : cursor[field] } },
      { [field]: isTypeDate ? Date.parse(cursor[field]) : cursor[field], _id: { [this.op]: new ObjectId(cursor._id) } },
    ];
  }

  /**
   * Gets the criteria.
   * @private
   * @returns the total number of documents
   */

  async getCriteria() {
    let filter = { ...this.criteria };

    if (this.skip) {
      return filter;
    }

    if (this.cursor) {
      if (filter.$or) {
        const modelIds = await this.Model.distinct('_id', this.criteria);
        filter = { _id: { $in: modelIds } };
      }

      const criteriaCursor = this.getCriteriaCursor(this.cursor);
      return { ...filter, $or: criteriaCursor };
    }

    return filter;
  }

  /**
   *
   * @returns the total number of documents found based criteria
   */
  async getTotalDocs() {
    const count = await this.Model.countDocuments(this.criteria);
    return count;
  }

  /**
   *
   * @returns the list documents found based criteria
   */
  async getDocs() {
    const criteria = await this.getCriteria();

    const docs = await this.Model.find(criteria)
      .sort(this.sortValue)
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
    const { field } = this.sort;

    if (!docs || !docs.length) {
      return null;
    }

    let cursorFields = {};
    const lastDocs = docs[docs.length - 1];

    if (this.isSortId) {
      cursorFields = { _id: lastDocs._id };
    } else {
      cursorFields = { _id: lastDocs._id, [field]: lastDocs[field] };
    }

    return Buffer.from(JSON.stringify(cursorFields)).toString('base64');
  }
}

module.exports = Pagination;
