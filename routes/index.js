
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { appTitle: 'Asteroid Game'});
};