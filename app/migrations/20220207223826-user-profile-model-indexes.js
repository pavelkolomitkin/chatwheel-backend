module.exports = {
  async up(db, client) {

    await db.collection('users').createIndex({geoLocation: '2dsphere'});
    await db.collection('userinterests').createIndex({name: 1});

  },

  async down(db, client) {

    await db.collection('users').dropIndex({geoLocation: '2dsphere'});
    await db.collection('userinterests').dropIndex({name: 1});
  }
};
