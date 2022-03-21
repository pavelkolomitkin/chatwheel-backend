module.exports = {
  async up(db, client) {

    await db.collection('email').createIndex({ email: 1 }, { collection: { locale: 'en', strength: 1 } });
  },

  async down(db, client) {

    await db.collection('email').dropIndex({ email: 1 }, { collection: { locale: 'en', strength: 1 } });
  }
};
