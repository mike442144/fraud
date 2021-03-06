"use strict";

module.exports = function(sequelize,DataTypes){
    var Person = sequelize.define("Person",{
	personid:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true
	},
	name:DataTypes.STRING,
	nickname:DataTypes.STRING,
	age:DataTypes.INTEGER,
	office:DataTypes.STRING,
	email:DataTypes.STRING,
	majors:DataTypes.STRING,
	education:DataTypes.STRING,
	yearborn:DataTypes.STRING,
	home:DataTypes.TEXT,
	homephone:DataTypes.STRING,
	main:DataTypes.STRING,
	homefax:DataTypes.STRING,
	fax:DataTypes.STRING,
	directphone:DataTypes.STRING,
	mobile:DataTypes.STRING,
	directfax:DataTypes.STRING,
	otherphone:DataTypes.STRING,
	pager:DataTypes.STRING,
	desc:DataTypes.TEXT,
	title:DataTypes.STRING,
	fraud:DataTypes.INTEGER,
	source:DataTypes.INTEGER
    });
    return Person;
};
