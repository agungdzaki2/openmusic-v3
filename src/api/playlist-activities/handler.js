/* eslint no-underscore-dangle: 0 */
const ClientError = require('../../exceptions/ClientError');

class PlaylistActivitiesHandler {
  constructor(service) {
    const { playlistActivitiesService, playlistsService } = service;
    this._service = playlistActivitiesService;
    this._playlistsService = playlistsService;

    this.getPlaylistActivitiesByIdHandler = this.getPlaylistActivitiesByIdHandler.bind(this);
  }

  async getPlaylistActivitiesByIdHandler(request, h) {
    try {
      const { id: credentialId } = request.auth.credentials;
      const { id: playlistId } = request.params;
      await this._playlistsService.verifyPlaylistAccess(credentialId, playlistId);
      let activities = null;
      activities = await this._service.getPlaylistActivitiesById(playlistId, credentialId);
      return {
        status: 'success',
        data: {
          playlistId,
          activities,
        },
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
        message: 'Maaf, terjadi kegagaln pada server kami.',
      });
      response.code(500);
      console.log(error);
      return response;
    }
  }
}

module.exports = PlaylistActivitiesHandler;
