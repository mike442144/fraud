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
	return (file.search("~")==-1 && file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
	var model = sequelize["import"](path.join(__dirname, file));
	console.log(model.name);
	db[model.name] = model;
    });

//define the relationship for the objects.
db.Company.hasMany(db.Person,{through:db.CompanyPerson,as:"Employees"})
db.Person.hasMany(db.Company,{through:db.CompanyPerson,as:"Companies"})
db.Person.hasMany(db.Company,{through:db.BoardMembership,as:"Boards"})
db.Company.hasMany(db.Person,{through:db.BoardMembership,as:"BoardMembers"})
db.Stock.belongsTo(db.Company,{foreignKey:"companyid"})
db.Company.hasOne(db.Stock,{foreignKey:"companyid"})
db.Quote.belongsTo(db.Stock,{foreignKey:"stockcode"})
db.Stock.hasMany(db.Quote,{foreignKey:"stockcode"})

db.Company.hasMany(db.UploadedFile,{foreignKey:"companyid"})
db.UploadedFile.belongsTo(db.Company,{foreignKey:"companyid"})

db.Person.hasMany(db.UploadedFile,{foreignKey:'personid'})
db.UploadedFile.belongsTo(db.Person,{foreignKey:'personid'})

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
	db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
