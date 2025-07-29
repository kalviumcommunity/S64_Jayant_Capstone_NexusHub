const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const protect = require('../middleware/protectMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Team routes
router.route('/')
  .post(protect, upload.single('banner'), teamController.createTeam)
  .get(protect, teamController.getTeams);

router.get('/my-teams', protect, teamController.getMyTeams);

router.route('/:id')
  .get(protect, teamController.getTeam)
  .put(protect, upload.single('banner'), teamController.updateTeam)
  .delete(protect, teamController.deleteTeam);

// Team member routes
router.post('/:id/members', protect, teamController.addMember);
router.delete('/:id/members/:userId', protect, teamController.removeMember);
router.put('/:id/members/:userId', protect, teamController.updateMemberRole);

// Team join request routes
router.post('/:id/join', protect, teamController.requestToJoin);
router.post('/:id/join-accept', protect, teamController.acceptJoinRequest);
router.post('/:id/join-decline', protect, teamController.declineJoinRequest);
router.get('/:id/join-requests', protect, teamController.listJoinRequests);

// Suggested teams
router.get('/suggested', protect, teamController.suggestedTeams);

module.exports = router;