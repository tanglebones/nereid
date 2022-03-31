import {DateTime} from "luxon";

export const nowMs = () => DateTime.now().toUTC().toMillis();
