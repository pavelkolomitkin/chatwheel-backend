module.exports = {
  async up(db, client) {

    await db.collection('abusereporttypes').insertOne({title: 'Cyberstalking', code: 'cyberstalking'});
    await db.collection('abusereporttypes').insertOne({title: 'Trolling', code: 'trolling'});
    await db.collection('abusereporttypes').insertOne({title: 'Creeping', code: 'creeping'});
    await db.collection('abusereporttypes').insertOne({title: 'Sexual', code: 'sexual'});
    await db.collection('abusereporttypes').insertOne({title: 'Other', code: 'other'});
  },

  async down(db, client) {

    await db.collection('abusereporttypes').remove({});
  }
};
