const User = require('../models/User');

module.exports = {
  // Get all users
  getUsers(req, res) {
    User.find({})
      .select('-__v')
      .then((users) => res.json(users))
      .catch((err) => res.status(500).json(err));
  },
  // Get single user by ID
  getSingleUser(req, res) {
    User.findOne({ _id: req.params.userId })
      .populate([
        { path: 'thoughts', select: "-__v" },
        { path: 'friends', select: "-__v" }
      ])
      .select('-__v')
      .then((user) =>
        !user
          ? res.status(404).json({ message: 'No user with that ID' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },
  // Create a new user
  createUser(req, res) {
    User.create(req.body)
      .then((user) => res.json(user))
      .catch((err) => res.status(500).json(err));
  },
  // Update user by ID
  updateUser(req, res) {
    User.findOneAndUpdate({ _id: req.params.userId }, req.body, { new: true, runValidators: true })
      .then(userData => {
        !userData
          ? res.status(404).json({ message: 'No user found with this id' })
          : res.json(userData);
      })
      .catch(err => res.status(400).json(err));
  },
  // Delete user by ID
  deleteUser(req, res) {
    User.findOneAndDelete({ _id: req.params.userId })
      .then(userData => {
        !userData
          ? res.status(404).json({ message: 'No user found with this id' })
          : User.updateMany(
            { _id: { $in: userData.friends } },
            { $pull: { friends: req.params.userId } }
          )
            .then(() => {
              Thought.deleteMany({ username: userData.username })
                .then(() => {
                  res.json({ message: "Successfully deleted user" });
                })
                .catch(err => res.status(400).json(err));
            })
            .catch(err => res.status(400).json(err));
      })
      .catch(err => res.status(400).json(err));
  },
  // add friendId to userId's friend list
  addFriend(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $addToSet: { friends: req.params.friendId } },
      { new: true, runValidators: true }
    )
      .then(userData => {
        !userData
          ? res.status(404).json({ message: 'No user found with this userId' })
          : User.findOneAndUpdate(
            { _id: req.params.friendId },
            { $addToSet: { friends: req.params.userId } },
            { new: true, runValidators: true }
          )
            .then(userData2 => {
              !userData2
                ? res.status(404).json({ message: 'No user found with this friendId' })
                : res.json(userData);
            })
            .catch(err => res.json(err));
      })
      .catch(err => res.json(err));
  },

  // Delete friend 
  deleteFriend(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $pull: { friends: req.params.friendId } },
      { new: true, runValidators: true }
    )
      .then(userData => {
        !userData
          ? res.status(404).json({ message: 'No user found with this userId' })
          : User.findOneAndUpdate(
            { _id: req.params.friendId },
            { $pull: { friends: req.params.userId } },
            { new: true, runValidators: true }
          )
            .then(userData2 => {
              !userData2
                ? res.status(404).json({ message: 'No user found with this friendId' })
                : res.json({ message: 'Successfully deleted the friend' });
            })
            .catch(err => res.json(err));
      })
      .catch(err => res.json(err));
  }
}