"use strict";

module.exports = function(sequelize,DataTypes){
    var Person = sequelize.define("Person",{
	personid:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true
	},
	name:DataTypes.STRING
    });
    return Person;
};
