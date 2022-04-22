const Joi = require('joi');

const PlaylistSongPayloadSchema = Joi.object({
  playlistId: Joi.string().required(),
  songId: Joi.string().required(),
});

module.exports = { PlaylistSongPayloadSchema };
