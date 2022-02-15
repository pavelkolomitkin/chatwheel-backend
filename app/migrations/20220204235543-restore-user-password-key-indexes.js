module.exports = {
  async up(db, client) {

    await db.collection('restoreuserpasswordkeys').createIndex({key: 1}, {unique: true});
    await db.collection('restoreuserpasswordkeys').createIndex({key: 1, user: 1}, {unique: true});

  },

  async down(db, client) {

    await db.collection('restoreuserpasswordkeys').dropIndex({key: 1});
    await db.collection('restoreuserpasswordkeys').dropIndex({key: 1, user: 1});
  }
};
