/* eslint no-underscore-dangle: 0 */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapDBToModelAlbums } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
    await this._cacheService.delete('albums');
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year, "coverUrl" FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
    await this._cacheService.set(`album:${id}`, JSON.stringify(result.rows[0]));
    return result.rows.map(mapDBToModelAlbums)[0];
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
    await this._cacheService.delete(`album:${id}`);
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
    await this._cacheService.delete(`album:${id}`);
  }

  async addCoverAlbumById(id, cover) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
      values: [cover, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui Sampul. Id tidak ditemukan');
    }
  }

  async addAlbumLike(albumId, userId) {
    const queryAddLike = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const resultAddLike = await this._pool.query(queryAddLike);

    if (!resultAddLike.rowCount) {
      const id = `likes-${nanoid(16)}`;
      const queryInsertLike = {
        text: 'INSERT INTO user_album_likes (id, album_id, user_id) VALUES ($1, $2, $3)',
        values: [id, albumId, userId],
      };
      const resultInsertLike = await this._pool.query(queryInsertLike);

      if (!resultInsertLike.rowCount) {
        throw new InvariantError('Like gagal ditambahkan');
      }
    } else {
      const queryDeleteLike = {
        text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
        values: [albumId, userId],
      };
      const resultDeleteLike = await this._pool.query(queryDeleteLike);

      if (!resultDeleteLike.rowCount) {
        throw new InvariantError('Like gagal dihapus');
      }
    }
    await this._cacheService.delete(`likes:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return { likes: JSON.parse(result), isCache: 1 };
    } catch (error) {
      const query = {
        text: 'SELECT user_id FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this._pool.query(query);

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(result.rows));
      return { likes: result.rows };
    }
  }
}

module.exports = AlbumsService;
