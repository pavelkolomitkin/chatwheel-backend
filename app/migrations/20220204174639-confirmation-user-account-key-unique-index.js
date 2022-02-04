module.exports = {
  async up(db, client) {

    await db.collection('confirmationuseraccountkeys').createIndex({ key: 1 }, { unique: true });
  },

  async down(db, client) {

    await db.collection('confirmationuseraccountkeys').dropIndex({ key: 1 });
  }
};
