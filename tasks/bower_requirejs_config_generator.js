/*
 * bower-requirejs-config-generator
 * https://github.com/micheledisalvatore/bower-requirejs-config-generator
 *
 * Copyright (c) 2015 Michele Di Salvatore
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var r = require("require-config")({ cache : false , autoshim: false});
module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerTask('bower_requirejs_config_generator', 'A generator of require config file with paths and shims, getting informations from bower.json', function() {

    var errorsString = '';
    var options = this.options();

    var bower_components_dir = 'bower_components';

    if(fs.existsSync('.bowerrc')){
      var bowerrc = JSON.parse(fs.readFileSync('.bowerrc', 'utf8'));

      if(bowerrc.hasOwnProperty('directory')){
        bower_components_dir = bowerrc.directory;  
      }
    }

    var bowerJSONMain = JSON.parse(fs.readFileSync('bower.json', 'utf8'));

    var bowerJSON, paths = {}, shim = {}, filePath, mainFilePath, bowerJSONFiles = [];

    for(var dependency in bowerJSONMain.dependencies){
      if (fs.existsSync(bower_components_dir + '/' + dependency + '/bower.json')) {
        dependency = dependency.replace(/['"]/g,'');
        bowerJSONFiles[dependency] = bower_components_dir + '/' + dependency + '/bower.json';
      }else{
        errorsString += "bower json file not found: " + dependency + "\n"
      }
    }

    //console.log('bowerJSONFiles',bowerJSONFiles);
    var regEx = /[\.\/]{0,3}(.*)\.js$/i;
    for(dependency in bowerJSONFiles) {
      bowerJSON = JSON.parse(fs.readFileSync(bowerJSONFiles[dependency], 'utf8'));
      mainFilePath = ''; filePath = null;

      if (typeof bowerJSON.main == 'string') {
        if(regEx.exec(bowerJSON.main)){
          mainFilePath = regEx.exec(bowerJSON.main)[1]
        }
      } else {
        for (var i in bowerJSON.main) {
          if(regEx.exec(bowerJSON.main[i])){
            mainFilePath = regEx.exec(bowerJSON.main[i])[1]
          }
        }
      }

      if (mainFilePath.length) {
        paths[dependency] = dependency + '/' + mainFilePath;
      } else {
        errorsString += "main js file not found: " + dependency + "\n"
      }

      if(typeof shim[dependency] == 'undefined')
        shim[dependency] = {deps: []};

      for(var innerDependency in bowerJSON.dependencies){
        shim[dependency].deps.push(innerDependency)
      }


    }

    // console.log('paths',paths);
    // console.log('shim',shim);


    r.set({ baseUrl : options.baseUrl || 'bower_components' });

    r.set( {paths: paths} );
    r.set( {shim: shim} );


    var requireConfig = r.render();
    var fileContent = "require.config("+JSON.stringify(requireConfig, null, "\t")+");\n" + 
      "/* Errors:\n" + 
      errorsString +
      "*/";

    fs.writeFileSync(options.destination || 'require-config.js', fileContent);
  });

};
