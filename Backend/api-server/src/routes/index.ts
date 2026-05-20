import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import lessonsRouter from "./lessons";
import leaderboardRouter from "./leaderboard";
import achievementsRouter from "./achievements";
import shopRouter from "./shop";
import coursesRouter from "./courses";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/courses", coursesRouter);
router.use(meRouter);
router.use(lessonsRouter);
router.use(leaderboardRouter);
router.use(achievementsRouter);
router.use(shopRouter);
router.use(aiRouter);

export default router;
