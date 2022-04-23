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
      const { id } = request.params;
      const { id: credentialId } = request.auth.credentials;

      await this._playlistsService.verifyPlaylistAccess(id, credentialId);
      let activities = null;
      activities = await this._service.getPlaylistActivitiesById(id, credentialId);

      return {
        status: 'success',
        data: {
          playlistId: id,
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
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });

      response.code(500);
      console.log(error);
      return response;
    }
  }
}

module.exports = PlaylistActivitiesHandler;
