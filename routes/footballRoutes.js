import express from 'express';
import { getTeams, getTeamPlayers, getMatches, getTeamMatches , getStandings, searchTeams, getTournaments, getTeamById, startMatch, createMatch, updateMatch, deleteMatch} from '../controllers/footballController.js';
import { verifyToken, isAdmin } from '../controllers/authController.js';


const router = express.Router();

// Định nghĩa các biển báo
router.post('/matches', verifyToken, isAdmin, createMatch);
router.patch('/matches/:id/start', verifyToken, isAdmin, startMatch);
router.put('/matches/:id', verifyToken, isAdmin, updateMatch);
router.delete('/matches/:id', verifyToken, isAdmin, deleteMatch);
router.get('/teams', getTeams);
router.get('/tournaments', getTournaments);
router.get('/teams/search', searchTeams);
router.get('/teams/:id/players', getTeamPlayers);
router.get('/matches', getMatches);
router.get('/standings/:tournamentId', getStandings);
router.get('/teams/:id', getTeamById); //
router.get('/teams/:id/matches', getTeamMatches);



export default router;