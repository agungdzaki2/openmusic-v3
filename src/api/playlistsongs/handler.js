/* eslint no-underscore-dangle: 0 */
const ClientError = require('../../exceptions/ClientError');

class PlaylistSongsHandler {
  constructor({
    playlistSongsService, songsService, playlistsService, playlistActivitiesService,
  }, validator) {
    this._service = playlistSongsService;
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._playlistActivitiesService = playlistActivitiesService;
    this._validator = validator;

    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistSongsHandler = this.getPlaylistSongsHandler.bind(this);
    this.deletePlaylistSongsHandler = this.deletePlaylistSongsHandler.bind(this);
  }

  async postPlaylistSongHandler(request, h) {
    try {
      this._validator.validatePlaylistSongsPayload(request.payload);
      const { songId } = request.payload;
      const { id: credentialId } = request.auth.credential;
      const { id: playlistId } = request.params;
      await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
      await this._songsService.getSongById(songId);
      const SongId = await this._service.addSongsToPlaylist(playlistId, songId);
      await this._playlistActivitiesService.addActivities(playlistId, songId, credentialId, 'add');
      const response = h.response({
        status: 'success',
        message: 'Lagu Playlist berhasil ditambahkan',
        data:
                SongId,
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf terjadi kegagalan di server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getPlaylistSongsHandler(request, h) {
    try {
      const { id: credentialId } = request.auth.credentials;
      const { id: playlistId } = request.params;
      await this._playlistsService.verifyPlaylistAccess(credentialId, playlistId);
      const playlist = await this._playlistsService.getPlaylistsById(playlistId);
      const songs = await this._songsService.getSongPlaylistsById(playlistId);
      playlist.songs = songs;
      return {
        status: 'success',
        data: { playlist },
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf terjadi kegagalan di server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deletePlaylistSongsHandler(request, h) {
    try {
      this._validator.validatePlaylistSongsPayload(request.payload);
      const { songId } = request.payload;
      const { id: playlistId } = request.params;
      const { id: credentialId } = request.auth.credentials;
      await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId);
      await this._service.deleteSongsFromPlaylist(playlistId, songId);
      await this._playlistActivitiesService.addActivities(playlistId, songId, credentialId, 'delete');
      return {
        status: 'success',
        message: 'Playlist song berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'fail',
        message: 'Maaf terjadi kegagalan di server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = PlaylistSongsHandler;
