import { org as orgApi, useOrgs } from "../api/org";
import useUser from "../lib/useUser";
import Link from "next/link";
import { OrganizationList } from "../components/OrganizationList";
import LoadingPage from "../components/LoadingPage";
import ErrorMessage from "../components/ErrorMessage";

import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from "react";

import React, { PureComponent } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


type Event = {
    id: string;
    type: string;
    username?: string;
    data: string;
}

// const EVENTS_SUBSCRIPTION = gql`
//   subscription GetEvents {
//     events {
//         type
//         data
//         createdAt
//     }
//   }
// `;

const NEW_EVENTS = gql`
   query GetEvents($since: DateTime) {
        events(since:$since) {
            username
            type
            data
        }
   }
`;

export default function Events() {
    const {
        currentUser: { isLoggedIn },
    } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [lastDate, setLastDate] = useState<Date | undefined>(undefined);
    const { data, loading, error, startPolling } = useQuery(
        NEW_EVENTS, {
        variables: lastDate ? {
            since: lastDate
        } : { since: null },
        pollInterval: 1000
    }
    );
    startPolling(1000);
    useEffect(() => {
        if (lastDate == undefined) {
            setEvents([])
        }
        if (data && data.events.length > 0) {
            setEvents((prevData: any) => [...prevData, ...data.events]);
            setLastDate(data.events[data.events.length - 1].createdAt);
        }
    }, [data]);
    if (loading) {
        return <LoadingPage />;
    }
    if (error) return <ErrorMessage error={error} />;

    const eventCounts = events.reduce<any>((acc: any, event: Event) => {
        const { type } = event;
        if (type === 'login') {
            acc.logins++;
        }
        if (type === 'create_org_failed') {
            acc.createFailed++;
        }
        if (type === 'create_org') {
            acc.createSuccess++;
        }
        return acc;
    }, { logins: 0, createFailed: 0, createSuccess: 0 });

    const chartData = [
        {
            name: 'Logins',
            value: eventCounts.logins,
            fill: '#bc5090'
        },
        {
            name: 'Create Failed',
            value: eventCounts.createFailed,
            fill: '#003f5c'
        },
        {
            name: 'Create Success',
            value: eventCounts.createSuccess,
            fill: '#ffa600'
        },
    ];

    return [
        <>
            <div className="sm:mt-8 bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="-ml-4 -mt-2">
                    <div className="ml-4 mt-2">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Events
                        </h3>
                    </div>
                    <BarChart
                        width={500}
                        height={300}
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" />
                    </BarChart>
                    <div className="mt-10">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Type
                                        </th>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            User
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                            Data
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {events.map((event: any) => (
                                        <tr key={event.id}>
                                            <td key="type" className="px-3 py-4 text-sm text-gray-500">{event.type}</td>
                                            <td key="username" className="px-3 py-4 text-sm text-gray-500">{event.username}</td>
                                            <td key="data" className="px-3 py-4 text-sm text-gray-500 ">{event.data}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

        </>
    ];
}
