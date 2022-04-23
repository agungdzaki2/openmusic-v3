/* eslint no-underscore-dangle: 0 */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylistActivities(
    playlistId, songId, userId, action,
  ) {
    const id = `playlist_activities-${nanoid(16)}`;
    const time = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Aktivitas Playlist gagal ditambahkan.');
    }
    return result.rows[0].id;
  }

  async getPlaylistActivitiesById(playlistId, owner) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_activities.action, playlist_activities.time 
      FROM playlist_activities JOIN playlists ON playlists.id = playlist_activities.playlist_id JOIN songs 
      ON songs.id = playlist_activities.song_id JOIN users ON users.id = playlist_activities.user_id LEFT 
      JOIN collaborations ON collaborations.playlist_id = playlist_activities.id WHERE playlists.id = $1 AND 
      playlists.owner = $2 OR collaborations.user_id = $2 ORDER BY playlist_activities.time ASC`,
      values: [playlistId, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows;
  }
}

module.exports = PlaylistActivitiesService;
