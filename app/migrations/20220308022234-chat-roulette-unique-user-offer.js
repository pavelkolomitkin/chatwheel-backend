module.exports = {
  async up(db, client) {

    await db.collection('chatrouletteoffers').createIndex({user: 1}, { unique: true });
  },

  async down(db, client) {

    await db.collection('chatrouletteoffers').dropIndex({user: 1});
  }
};
