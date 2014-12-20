"use strict";

module.exports = function(sequelize,DataTypes){
    var CompanyPerson = sequelize.define("CompanyPerson",{
	title:DataTypes.STRING,
	startyear:DataTypes.STRING,
	endyear:DataTypes.STRING,
	degree:DataTypes.INTEGER
    });
    return CompanyPerson;
};
