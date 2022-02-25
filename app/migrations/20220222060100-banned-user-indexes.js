module.exports = {
  async up(db, client) {
    await db.collection('bannedusers').createIndex({ applicant: 1, banned: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('bannedusers').dropIndex({ applicant: 1, banned: 1 });
  }
};
