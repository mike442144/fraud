"use strict";

module.exports = function(sequelize,DataTypes){
    var CompanyRelationship = sequelize.define("CompanyRelationship",{
	companyid:DataTypes.INTEGER,
	companyname:DataTypes.STRING,
	providerid:DataTypes.INTEGER,
	providername:DataTypes.STRING,
	type:DataTypes.STRING
    });
    return CompanyRelationship;
};
