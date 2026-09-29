const musicModel=require('../models/music.models');
const albumModel=require('../models/album.model');
const jwt=require('jsonwebtoken');
const { uploadFile } = require('../services/storage.service');

function getTokenFromRequest(req) {
    const cookieToken = req.cookies && req.cookies.token;
    if (cookieToken) {
        return cookieToken;
    }

    return null;
}

async function createMusic(req,res){
   
        const { title } = req.body;
        const file = req.file;

        const result = await uploadFile(file.buffer.toString('base64'));
          const music = await musicModel.create({
            uri: result.url,
            title,
            artist:req.user.id,
        });

        return res.status(201).json({
            message: "Music created successfully",
            music: {
                id: music._id,
                title: music.title,
                uri: music.uri,
                artist: music.artist,
            }
        })
} 

async function createAlbum(req,res){

     const { title, musics } = req.body;

     const album = await albumModel.create({
        title,
        musics:musics,
        artist:req.user.id,
      });

        return res.status(201).json({
            message: "Album created successfully",
            album: {
                id: album._id,
                title: album.title,
                musics: album.musics,
                artist: album.artist,
            }
        })
} 

async function getAllMusic(req,res){
    
const musics = await musicModel
 .find()
 .skip(2)
 .limit(3)
 .populate('artist','username email');
   return res.status(200).json({
    message: "All music fetched successfully",
    musics: musics,
   })   
    
} 

async function getAllAlbums(req,res){

  const albums = await albumModel.find().select('title  artist').populate('artist').populate('musics');

    return res.status(200).json({
    message: "Albums fetched successfully",
    albums: albums,
   })   

}

async function getAlbumById(req,res){

  const { albumId } = req.params;

  const album = await albumModel.findById(albumId).populate('artist','username email');

    return res.status(200).json({
    message: "Album fetched successfully",
    album: album,
   })
}

  module.exports = { createMusic, createAlbum, getTokenFromRequest ,getAllMusic, getAllAlbums, getAlbumById}
