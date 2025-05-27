"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { List, LayoutGrid } from 'lucide-react'

import { ModelPlaygroundBtn } from './ModelPlaygroundBtn';

import { fetchModelDatas, fetchServiceModels } from './function';
import { ModelData_Payload, marker } from '.';
import { UNIEINFRA_OPENAI_API_URL } from "@/utils/unieai/unieinfra/key";
import { useUnieInfra } from "@/utils/unieai/unieinfra/provider/UnieInfraProvider";

type Filter = 'all' | marker.Text | marker.Text2Image | marker.TTS | marker.STT | marker.Custom | marker.Embedding;

export const AiModelsLibraryForm = () => {

    const { defaultToken } = useUnieInfra();

    const [filter, setFilter] = useState<Filter>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [serviceModels, setServiceModels] = useState<any[]>([]);
    const [modeDatalList, setModeDatalList] = useState<ModelData_Payload[]>([]);

    const filters: { value: Filter; label: string }[] = [
        { value: 'all', label: 'all_models' },
        { value: marker.Text, label: 'text_generation' },
        { value: marker.Text2Image, label: 'text_to_image' },
        { value: marker.TTS, label: 'speech_recognition' },
        { value: marker.STT, label: 'speech_to_text' },
        { value: marker.Embedding, label: 'embeddings' },
        { value: marker.Custom, label: 'custom' },
    ];

    const filteredData = filter === 'all'
        ? modeDatalList
        : modeDatalList.filter(item => item.marker === filter);

    // Group models by marker type
    const groupedModels = filteredData.reduce((acc, model) => {
        const marker = model.marker
        if (!acc[marker]) {
            acc[marker] = []
        }
        acc[marker].push(model)
        return acc
    }, {} as Record<string, typeof modeDatalList>);

    useEffect(() => {
        async function fetchData() {
            const datas1: any[] = await fetchServiceModels(`${UNIEINFRA_OPENAI_API_URL}/models`, defaultToken!);
            setServiceModels(datas1);
            console.log(`datas1: `, datas1);

            const datas2: ModelData_Payload[] = await fetchModelDatas();
            setModeDatalList(datas2);
            console.log(`datas2: `, datas2);
        }

        if (defaultToken !== null) fetchData();
    }, [defaultToken]);

    return (
        <div className="h-full w-full p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">AI Models Library</h1>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex gap-2">
                        {filters.map((f) => (
                            <Button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                variant="outline"
                                className={`${filter === f.value
                                    ? "bg-zinc-200 dark:bg-black"
                                    : "bg-white dark:bg-zinc-800"
                                    } border-zinc-200 dark:border-zinc-800`}
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className={`${viewMode === 'list' ? 'bg-zinc-200 dark:bg-black' : 'bg-white dark:bg-zinc-800'} border-zinc-200 dark:border-zinc-800`}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={`${viewMode === 'grid' ? 'bg-zinc-200 dark:bg-black' : 'bg-white dark:bg-zinc-800'} border-zinc-200 dark:border-zinc-800`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-8">
                    {Object.entries(groupedModels).map(([_marker, models]) => (
                        <div key={_marker} className="space-y-4">
                            <h2 className="text-2xl font-semibold capitalize">{_marker}</h2>
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                {models.map((model, index) => (
                                    <Card key={index} className="bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden">
                                        <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row'}`}>
                                            <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'h-48 w-full' : 'h-full w-48'}`}>
                                                <img
                                                    src={model.img_src}
                                                    alt={model.name}
                                                    className={`${viewMode === 'grid' ? 'w-full h-auto' : 'h-full w-auto'}`}
                                                />
                                            </div>
                                            <div className="p-4 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex flex-row gap-2 items-center ">
                                                            <h3 className="font-medium text-lg hover:underline">
                                                                <Link
                                                                    href={`/models/service/${model.name}`} // 要更新
                                                                >
                                                                    {model.name}
                                                                </Link>
                                                            </h3>
                                                            <Badge variant="secondary" className="bg-gray-200 dark:bg-zinc-800">
                                                                {model.tokens}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{model.provider}</p>
                                                    </div>
                                                    <ModelPlaygroundBtn
                                                        serviceModels={serviceModels}
                                                        title="Try It"
                                                        model={model} />
                                                </div>
                                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{model.description}</p>
                                                <div className="mt-4 flex items-center gap-4 justify-between">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 border-blue-200 dark:border-blue-800"
                                                    >
                                                        {model.marker}
                                                    </Badge>
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{model.cost}</span>
                                                </div>


                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    )
}