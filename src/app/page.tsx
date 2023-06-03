import Image from "next/image";
import { GarbageCollectionDetails } from "./GarbageCollectionDetails";
import { z } from "zod";
import {env} from "../env";

const ScheduleSchema = z.object({
  commodity: z.enum(["Black", "Blue", "Green"]),
  current_season: z.string(),
  clect_int_winter: z.string(),
  collection_day_winter: z.string(),
  clect_int_summer: z.string(),
  collection_day_summer: z.string(),
  clect_day_code: z.coerce.number(),
});

const responseSchema = z.array(ScheduleSchema);

export type CollectionFrequency = "EVERY" | "ODD" | "EVEN";

type ScheduleInput = z.infer<typeof ScheduleSchema>;
export type Schedule = {
  collectionFrequency: CollectionFrequency;
  collectionDay: string;
  collectionDayCode: number;
  type: "Blue" | "Green" | "Black";
}

function processSchedules(data: ScheduleInput[]): Schedule[] {
  const blackBin = data.find((schedule) => schedule.commodity === "Black");
  const blueBin = data.find((schedule) => schedule.commodity === "Blue");
  const greenBin = data.find((schedule) => schedule.commodity === "Green");

  if (!blackBin || !blueBin || !greenBin) {
    throw new Error("Could not find all bins");
  }

  const schedules = [blackBin, blueBin, greenBin].map((schedule) => {
    return processSchedule(schedule);
  });
  return schedules;
}

function parseCollectionDayToNumber(collectionDay: string): number {
  switch (collectionDay) {
    case "Sunday":
      return 0;
    case "Monday":
      return 1;
    case "Tuesday":
      return 2;
    case "Wednesday":
      return 3;
    case "Thursday":
      return 4;
    case "Friday":
      return 5;
    case "Saturday":
      return 6;
    default:
      throw new Error("Invalid collection day");
  }
}

function processSchedule(schedule: ScheduleInput): Schedule {
  const currentSeason = schedule.current_season;
  let collectionFrequency = schedule.clect_int_winter;
  let collectionDay = schedule.collection_day_winter;
  if (currentSeason === "SUMMER") {
    collectionFrequency = schedule.clect_int_summer;
    collectionDay = schedule.collection_day_summer;
  }
  return {
    collectionFrequency: collectionFrequency,
    collectionDay: collectionDay,
    type: schedule.commodity,
    collectionDayCode: parseCollectionDayToNumber(collectionDay),
  } as Schedule;
}

async function GarbageCollectionBox() {
  async function getCurrentSchedule(lat: number, long: number): Promise<Schedule[]> {
    "use server";
    const response = await fetch(
      `https://data.calgary.ca/resource/jq4t-b745.json?$where=within_circle(point, ${lat}, ${long}, 50)&$$app_token=${env.CALGARY_DATA_APP_TOKEN}`
    );
    const data = await response.json();
    const parsedData = responseSchema.parse(data);

    return processSchedules(parsedData);
  }

  return (
      <GarbageCollectionDetails getCurrentSchedule={getCurrentSchedule} />
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col flex-1 items-center">
        <h1 className="text-4xl font-bold">
          Calgary Garbage Collection Checker
        </h1>
        <div>
          <p className="text-xl">
            This is a simple app to check when your garbage is collected in
            Calgary.
          </p>
        </div>
        {/* @ts-expect-error Server Component */}
        <GarbageCollectionBox />
      </div>
    </main>
  );
}
