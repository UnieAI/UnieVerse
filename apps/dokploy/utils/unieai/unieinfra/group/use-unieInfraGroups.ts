import { useEffect, useState } from "react";
import { ListUnieInfraGroups } from "./ListUnieInfraGroups";

export const useUnieInfraGroups = () => {
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [groups, setGroups] = useState([]);

    const updateGroups = async (accessToken: string) => {
        if (isLoadingGroups) return;

        setGroups([]);
        setIsLoadingGroups(true);
        const _groups = await ListUnieInfraGroups(accessToken);
        console.log(`_groups: `, _groups);
        setGroups(_groups);
        setIsLoadingGroups(false);
    };

    return { groups, setGroupsByAccessToken: updateGroups, isLoadingGroups };
};