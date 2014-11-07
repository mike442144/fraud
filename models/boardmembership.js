"use strict";

module.exports = function(sequelize,DataTypes){
    var BoardMembership = sequelize.define("BoardMembership",{
	functions:DataTypes.STRING,
	status:DataTypes.STRING,
	yearonboard:DataTypes.STRING
    });
    return BoardMembership;
};
