import requireLogin from "../middlewares/requireLogin";
import express from "express";
import rootController from "../controllers/root";

const router = express.Router();

router.get("/", rootController.rootPage);
router.get("/users", rootController.usersList);
router.get("/admins", requireLogin, rootController.admins);
router.get("/login", rootController.logIn);

export default router;
