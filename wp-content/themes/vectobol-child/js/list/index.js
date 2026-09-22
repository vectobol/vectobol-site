import { loadData } from "./api.js";
import { initUI } from "./ui.js";

const API = "/wp-json/vectobol/v1/taxa";

loadData(API).then(initUI);