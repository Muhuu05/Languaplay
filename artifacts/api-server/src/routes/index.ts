import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import leaderboardRouter from "./leaderboard";
import achievementsRouter from "./achievements";
import shopRouter from "./shop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(coursesRouter);
router.use(lessonsRouter);
router.use(leaderboardRouter);
router.use(achievementsRouter);
router.use(shopRouter);

export default router;
