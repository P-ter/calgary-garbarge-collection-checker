"use client";

import React from "react";
import { useEffect, useState } from "react";
import { CollectionFrequency, Schedule } from "./page";
import Image from "next/image";
import { parse, differenceInCalendarWeeks, getDay, startOfWeek, addDays, differenceInCalendarDays, format, differenceInWeeks, addWeeks } from "date-fns";
type Props = {
  getCurrentSchedule: (lat: number, long: number) => Promise<Schedule[]>;
};

const BASE_DATE = parse("2017-07-17", "yyyy-MM-dd", new Date());

function isOdd(num: number): boolean {
  return num % 2 === 1;
}

function getDateOfThisWeek(dayToCheck:Date, dayOfWeek: number): Date {
  const startOfWeekDate = startOfWeek(dayToCheck);
  return addDays(startOfWeekDate, dayOfWeek);
}

function getDistanceInNatualLanguage(baseDate: Date, toDate: Date): string {
  const distanceInDays = differenceInCalendarDays(toDate, baseDate);
  const formattedToDate = format(toDate, "EEEE, MMMM do");
  if(distanceInDays === 0) {
    return "Today";
  } else if(distanceInDays === 1) {
    return "Tomorrow";
  } else if(distanceInDays < 7) {
    return `In ${distanceInDays} days, on ${formattedToDate}`;
  } else if(distanceInDays < 14) {
    return `Next week, on ${formattedToDate}`;
  } else {
    return `In ${differenceInWeeks(toDate, baseDate)} weeks, on ${formattedToDate}`;
  }
}

/**
 * Can I engineer this into a more complex and abstract solution? yes. but I have grown to appreciate the simplicity of a changable and readable codebase.
 */
function getNextCollectionDate(dayToCheck: Date,collectionDayCode:number, collectionDay: string, collectionFrequency: CollectionFrequency): string {
  const diffInWeeks = differenceInCalendarWeeks(dayToCheck, BASE_DATE);
  const currentDayOfWeek = dayToCheck.getDay();
  const dateOfThisWeekForCollectionDayCode = getDateOfThisWeek(dayToCheck, collectionDayCode);
  const collectEveryWeek = collectionFrequency === "EVERY";
  const collectOnOddWeeks = collectionFrequency === "ODD";
  const collectOnEvenWeeks = collectionFrequency === "EVEN";
  const isOddWeek = isOdd(diffInWeeks);
  const isEvenWeek = !isOddWeek;
  const thisWeekMatchCollectionFrequency = collectEveryWeek || (collectOnOddWeeks && isOddWeek) || (collectOnEvenWeeks && isEvenWeek);
  let weeksTillNextCollection = 1;
  if(thisWeekMatchCollectionFrequency && (collectOnOddWeeks || collectOnEvenWeeks) ) {
    weeksTillNextCollection = 2;
  }
  const nextCollectionDate = addWeeks(dateOfThisWeekForCollectionDayCode, weeksTillNextCollection);
  if(thisWeekMatchCollectionFrequency) {
    if(currentDayOfWeek === collectionDayCode) {
      return `Today. Next collection will be: ${getDistanceInNatualLanguage(dayToCheck, nextCollectionDate)}`;
    } else if(currentDayOfWeek < collectionDayCode) {
      return getDistanceInNatualLanguage(dayToCheck, dateOfThisWeekForCollectionDayCode);
    } else {
      return getDistanceInNatualLanguage(dayToCheck, nextCollectionDate);
    }
  } else {
    return getDistanceInNatualLanguage(dayToCheck, nextCollectionDate);
  } 
}



export const GarbageCollectionDetails: React.FC<Props> = ({
  getCurrentSchedule,
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(function (position) {
      getCurrentSchedule(
        position.coords.latitude,
        position.coords.longitude
      ).then((schedules) => {
        console.log(schedules);
        setSchedules(schedules);
      });
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center w-3/4 bg-white rounded-lg shadow-lg">
      {schedules.map((schedule) => {
        return <GarbageSchedule key={schedule.type} schedule={schedule} />;
      })}
    </div>
  );
};

const GarbageSchedule: React.FC<{ schedule: Schedule }> = ({ schedule }) => {
  let imgSrc = "";
  if (schedule.type === "Black") {
    imgSrc = "/imgs/BlackBin.png";
  } else if (schedule.type === "Blue") {
    imgSrc = "/imgs/BlueBin.png";
  } else if (schedule.type === "Green") {
    imgSrc = "/imgs/GreenBin.png";
  }

  const today = new Date();

  return (
    <div className="flex-1 flex w-full">
      <div className="flex-0 flex flex-col justify-center">
        <Image src={imgSrc} alt={schedule.type} width={100} height={200} />
      </div>
      <div className="flex-1 text-neutral-950 flex flex-col justify-center"><p className="text-center">{getNextCollectionDate(today, schedule.collectionDayCode, schedule.collectionDay, schedule.collectionFrequency)}</p></div>
    </div>
  );
};
