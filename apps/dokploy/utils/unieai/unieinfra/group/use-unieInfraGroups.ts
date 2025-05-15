import { useEffect, useState } from "react";
import { ListUnieInfraGroups } from "./ListUnieInfraGroups";

export const useUnieInfraGroups = () => {
        const [isLoading, setIsLoading] = useState(false);
        const [groups, setGroups] = useState([]);

    const getGroups = async (accessToken: string) => {
        if (isLoading) return;

        setGroups([]);
        setIsLoading(true);
        const _groups = await ListUnieInfraGroups(accessToken);
        console.log(`_groups: `, _groups);
        setGroups(_groups);
        setIsLoading(false);
    };

    return { groups, getGroups, isLoading };
};