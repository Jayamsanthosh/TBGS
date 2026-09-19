import { Router } from "express";
import {
  getAllHotelRoomTypeMaster,
  getHotelRoomTypeMasterById,
  saveHotelRoomTypeMaster,
  updateHotelRoomTypeMaster,
  deleteHotelRoomTypeMaster,
} from "../controllers/hotelRoomTypeMaster.controller";

const router = Router();

router.get("/", getAllHotelRoomTypeMaster);
router.get("/:id", getHotelRoomTypeMasterById);
router.post("/", saveHotelRoomTypeMaster);
router.put("/:id", updateHotelRoomTypeMaster);
router.delete("/:id", deleteHotelRoomTypeMaster);

export default router;