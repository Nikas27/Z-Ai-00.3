import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { CountryUserData, LiveUserData } from '../types';

// Expanded list of countries for a more global feel
const ALL_COUNTRIES: Omit<CountryUserData, 'count'>[] = [
    { name: 'USA', flag: '🇺🇸' }, { name: 'Brazil', flag: '🇧🇷' }, { name: 'Germany', flag: '🇩🇪' },
    { name: 'India', flag: '🇮🇳' }, { name: 'Japan', flag: '🇯🇵' }, { name: 'Canada', flag: '🇨🇦' },
    { name: 'United Kingdom', flag: '🇬🇧' }, { name: 'France', flag: '🇫🇷' }, { name: 'Australia', flag: '🇦🇺' },
    { name: 'Mexico', flag: '🇲🇽' }, { name: 'Nigeria', flag: '🇳🇬' }, { name: 'Russia', flag: '🇷🇺' },
    { name: 'South Korea', flag: '🇰🇷' }, { name: 'Argentina', flag: '🇦🇷' }, { name: 'Italy', flag: '🇮🇹' },
    { name: 'Spain', flag: '🇪🇸' }, { name: 'South Africa', flag: '🇿🇦' }, { name: 'Indonesia', flag: '🇮🇩' },
    { name: 'Turkey', flag: '🇹🇷' }, { name: 'Netherlands', flag: '🇳🇱' }
];

const defaultState: LiveUserData = {
  liveUserCount: 0,
  usersByCountry: [],
};

const LiveUserContext = createContext<LiveUserData>(defaultState);

export const LiveUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [liveData, setLiveData] = useState<LiveUserData>(() => {
        // Initial state simulation
        const initialUsers = Math.floor(Math.random() * 150) + 50; // Start with 50-200 users
        let remainingUsers = initialUsers;
        const initialCountries = ALL_COUNTRIES.map(c => {
            // Distribute users somewhat randomly
            const usersInCountry = Math.min(remainingUsers, Math.floor(Math.random() * (initialUsers / 5)));
            remainingUsers -= usersInCountry;
            return { ...c, count: usersInCountry };
        }).filter(c => c.count > 0);

        if (remainingUsers > 0 && initialCountries.length > 0) {
            initialCountries[0].count += remainingUsers;
        }

        return {
            liveUserCount: initialUsers,
            usersByCountry: initialCountries.sort((a, b) => b.count - a.count),
        };
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveData(prevData => {
                let newTotal = prevData.liveUserCount;
                let newCountries = JSON.parse(JSON.stringify(prevData.usersByCountry));

                // Simulate user joins/leaves
                for (let i = 0; i < 5; i++) { // More activity per tick
                    const change = Math.random() > 0.5 ? 1 : -1; // User joins or leaves
                    
                    if (change === 1) { // User joins
                        newTotal++;
                        let countryIndex = -1;
                        // A new user might be from a country not currently on the list
                        if (Math.random() > 0.8 && newCountries.length < ALL_COUNTRIES.length) {
                             const notShown = ALL_COUNTRIES.filter(ac => !newCountries.some((nc: CountryUserData) => nc.name === ac.name));
                             if (notShown.length > 0) {
                                const newCountry = notShown[Math.floor(Math.random() * notShown.length)];
                                newCountries.push({ ...newCountry, count: 1 });
                             } else if (newCountries.length > 0) {
                                countryIndex = Math.floor(Math.random() * newCountries.length);
                                newCountries[countryIndex].count++;
                             }
                        } else if (newCountries.length > 0) {
                            countryIndex = Math.floor(Math.random() * newCountries.length);
                            newCountries[countryIndex].count++;
                        }
                    } else if (newTotal > 0) { // User leaves
                         newTotal--;
                         const countryIndex = Math.floor(Math.random() * newCountries.length);
                         if (newCountries[countryIndex] && newCountries[countryIndex].count > 0) {
                            newCountries[countryIndex].count--;
                         } else {
                            newTotal++; // Revert the change if no one can leave
                         }
                    }
                }
                
                // Clean up countries with 0 users and sort
                const updatedCountries = newCountries
                    .filter((c: CountryUserData) => c.count > 0)
                    .sort((a: CountryUserData, b: CountryUserData) => b.count - a.count);

                return {
                    liveUserCount: Math.max(0, newTotal),
                    usersByCountry: updatedCountries,
                };
            });
        }, 2500); // Update every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <LiveUserContext.Provider value={liveData}>
            {children}
        </LiveUserContext.Provider>
    );
};

export const useLiveUserContext = () => useContext(LiveUserContext);
