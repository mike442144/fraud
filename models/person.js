"use strict";

modules.exports = function(sequelize,DataTypes){
    var Person = sequelize.define("Person",{
	personid:DataTypes.INT,
	name:DataTypes.STRING
    });
};
