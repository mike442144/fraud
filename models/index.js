"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(path.join(__dirname , '../config/config.json'))[env];

var sequelize = new Sequelize(config.database, config.username, config.password, config);
var db        = {};

fs.readdirSync(__dirname)
    .filter(function(file) {
	return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
	var model = sequelize["import"](path.join(__dirname, file));
	console.log(model.name);
	db[model.name] = model;
    });

//console.log(db.Company instanceof Sequelize.Model);
//console.log(db.Person instanceof Sequelize.Model);

db.Company.hasMany(db.Person,{through:db.CompanyPerson})
db.Person.hasMany(db.Company,{through:db.CompanyPerson})

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
	db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
