var Sequelize = require('sequelize');
var bcrypt = require('bcrypt');

// create a sequelize instance with our local postgres database information.
var sequelize = new Sequelize('mysql://bbadfc6ae46150:e441bb86@us-cdbr-iron-east-04.cleardb.net/heroku_c2aee30971014a9');

// setup User model and its fields.
var User = sequelize.define('users', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    hooks: {
      beforeCreate: (user) => {
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(user.password, salt);
      }
    },    
});

// setup Post model and its fields.
var Post = sequelize.define('posts', {
  body: {
      type: Sequelize.STRING,
      allowNull: false
  }
});

User.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
}

User.hasMany(Post);
Post.belongsTo(User);

// create all the defined tables in the remote SQL database.
sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User and Post model for use in the controller
module.exports = {User, Post};