'use client'

import { Card } from '@/components/ui/card'
import { AMRAPRound, EmomRound, TabataRound, TimerConfig, TimerType } from '@/hooks/useWorkoutTimer'
import { motion } from 'framer-motion'
import { ArrowLeft, CirclePlus, InfinityIcon, Play, X } from 'lucide-react'
import { useState } from 'react'

interface ConfigViewProps {
    timerType: TimerType
    onStart: (config: TimerConfig) => void
    onBack: () => void
    onClose: () => void
}

export function ConfigView({ timerType, onStart, onBack, onClose }: ConfigViewProps) {
    const [config, setConfig] = useState<TimerConfig>({
        rounds: 8,
        workSeconds: 45,
        restSeconds: 10,
        duration: 20,
        timeCap: 15,
        intervalMinutes: 1
    })

    const [amrapRounds, setAmrapRounds] = useState<AMRAPRound[]>([])
    const [tabataRound, setTabataRound] = useState<TabataRound>()
    const [emomRound, setEmomRound] = useState<EmomRound>()
    const [isDeathBy, setIsDeathBy] = useState(false)
    // const [fortimeRound, setFortimeRound] = useState<ForTimeRound>() // TODO: Implement FOR_TIME rounds
    const [noTimeCap, setNoTimeCap] = useState(false)

    const handleStart = () => {
        const finalConfig = { ...config }

        // Ajouter les AMRAP supplémentaires
        if (amrapRounds.length > 0) {
            finalConfig.amrapRounds = amrapRounds
        }

        // Ajouter le round Tabata supplémentaire
        if (tabataRound) {
            finalConfig.tabataRound = tabataRound
        }

        // Ajouter le round EMOM supplémentaire
        if (emomRound) {
            finalConfig.emomRound = emomRound
        }

        // Ajouter le flag Death By pour EMOM
        if (isDeathBy) {
            finalConfig.isDeathBy = true
            // En mode Death By, on ne veut pas de durée limite
            delete finalConfig.duration
        }

        // Ajouter le flag No Time Cap pour FOR TIME
        if (noTimeCap) {
            finalConfig.noTimeCap = true
            // Pas de time cap
            delete finalConfig.timeCap
        }

        onStart(finalConfig)
    }


    const addTabataRound = () => {
        setTabataRound({ round: 4, rest: 1 })
    }

    const updateTabataRound = (field: 'round' | 'rest', value: number) => {
        if (tabataRound) {
            setTabataRound({ ...tabataRound, [field]: value })
        }
    }
    const removeTabataRound = () => {
        setTabataRound(undefined)
    }


    const addAMRAPRound = () => {
        setAmrapRounds([...amrapRounds, { duration: 10, rest: 2 }])
    }

    const updateAMRAPRound = (index: number, field: 'duration' | 'rest', value: number) => {
        const updated = [...amrapRounds]
        updated[index][field] = value
        setAmrapRounds(updated)
    }

    const removeAMRAPRound = (index: number) => {
        setAmrapRounds(amrapRounds.filter((_, i) => i !== index))
    }

    const addEmomRound = () => {
        setEmomRound({ round: 4, rest: 1 })
    }

    const updateEmomRound = (field: 'round' | 'rest', value: number) => {
        if (emomRound) {
            setEmomRound({ ...emomRound, [field]: value })
        }
    }
    const removeEmomRound = () => {
        setEmomRound(undefined)
    }

    const renderConfig = () => {
        switch (timerType) {
            case 'TABATA':
                return (
                    <div >
                        <div className='flex items-center mb-2 ml-6'>
                            <input
                                type="number"
                                value={config.rounds}
                                onChange={(e) => setConfig({ ...config, rounds: parseInt(e.target.value) })}
                                className=" mt-1 mr-2 px-3 py-2 bg-muted border border-border rounded-lg w-16 border-purple-500 "
                                min="1"
                            />
                            <label className="text-sm font-medium">Tours </label>
                        </div>
                        <div className='flex items-center mb-2 ml-6'>
                            <input
                                type="number"
                                value={config.workSeconds}
                                onChange={(e) => setConfig({ ...config, workSeconds: parseInt(e.target.value) })}
                                className=" mt-1 mr-2 px-3 py-2 bg-muted border border-border rounded-lg w-16 border-purple-500"
                                min="1"
                            />
                            <label className="text-sm font-medium">Travail (secondes)</label>
                        </div>
                        <div className='flex items-center mb-2 ml-6'>
                            <input
                                type="number"
                                value={config.restSeconds}
                                onChange={(e) => setConfig({ ...config, restSeconds: parseInt(e.target.value) })}
                                className=" mt-1 mr-2 px-3 py-2 bg-muted border border-border rounded-lg w-16 border-purple-500"
                                min="1"
                            />
                            <label className="text-sm font-medium">Repos (secondes)</label>
                        </div>
                        {/* Bouton pour ajouter des rounds */}
                        {!tabataRound && (
                            <motion.div
                                className='flex justify-center items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors py-2'
                                onClick={addTabataRound}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <CirclePlus className="w-4 h-4 mr-2" />
                                Ajoute des réglages (facultatif)
                            </motion.div>
                        )}

                        {tabataRound ? (
                            <motion.div

                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className='my-1 p-3'>
                                    <div className='flex items-center justify-between'>
                                        <motion.button
                                            className="p-1 hover:bg-accent rounded transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={removeTabataRound}
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>

                                    <div className='flex items-center mb-2'>
                                        <input
                                            type="number"
                                            value={tabataRound.round}
                                            onChange={(e) => updateTabataRound('round', parseInt(e.target.value))}
                                            className="mx-2 ml-2 px-3 py-1.5 bg-muted border border-border rounded-lg w-16  border-purple-500"
                                            min="1"
                                        />
                                        <span className='text-sm'>Séries</span>
                                    </div>

                                    <div className='flex items-center'>
                                        <input
                                            type="number"
                                            value={tabataRound.rest}
                                            onChange={(e) => updateTabataRound('rest', parseInt(e.target.value))}
                                            className="mx-2 ml-2 px-3 py-1.5 bg-muted border border-border rounded-lg w-16  border-purple-400"
                                            min="0"
                                        />
                                        <span className='text-sm'>minutes de récupération</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : null}


                    </div >
                )
            case 'AMRAP':
                return (
                    <div>
                        {/* Premier AMRAP (obligatoire) */}
                        <div className='text-center mb-2'>
                            <label className="text-sm font-medium">Autant de tours que possible en</label>
                        </div>
                        <div className='flex justify-center items-center mb-4'>
                            <input
                                type="number"
                                value={config.duration}
                                onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                                className="mx-2 px-3 py-2 bg-muted border border-border rounded-lg w-16 border-orange-400"
                                min="1"
                            />
                            <span>minutes</span>
                        </div>

                        {/* Bouton pour ajouter d'autres AMRAP */}
                        <motion.div
                            className='flex justify-center items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors py-2'
                            onClick={addAMRAPRound}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <CirclePlus className="w-4 h-4 mr-2" />
                            Ajouter un AMRAP supplémentaire
                        </motion.div>

                        {/* Liste des AMRAP supplémentaires */}
                        {amrapRounds.map((round, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className='my-2 p-3'>
                                    <div className='flex items-center justify-between mb-2'>
                                        <label className='text-sm font-semibold'>AMRAP {index + 2}</label>
                                        <motion.button
                                            onClick={() => removeAMRAPRound(index)}
                                            className="p-1 hover:bg-accent rounded transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>

                                    <div className='flex items-center mb-2'>
                                        <input
                                            type="number"
                                            value={round.duration}
                                            onChange={(e) => updateAMRAPRound(index, 'duration', parseInt(e.target.value))}
                                            className="mx-2 px-3 py-1.5 bg-muted border border-border rounded-lg w-16 text-sm border-orange-400"
                                            min="1"
                                        />
                                        <span className='text-sm'>minutes</span>
                                    </div>

                                    <div className='flex items-center'>
                                        <input
                                            type="number"
                                            value={round.rest}
                                            onChange={(e) => updateAMRAPRound(index, 'rest', parseInt(e.target.value))}
                                            className="mx-2 px-3 py-1.5 bg-muted border border-border rounded-lg w-16 text-sm border-orange-400"
                                            min="0"
                                        />
                                        <span className='text-sm'>minutes de récupération</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )
            case 'EMOM':
                return (
                    <>
                        <div className='flex justify-center items-center mb-3'>
                            <label className="text-lg font-medium mr-2">Toutes les</label>
                            <input
                                type="number"
                                value={config.intervalMinutes}
                                onChange={(e) => setConfig({ ...config, intervalMinutes: parseInt(e.target.value) })}
                                className="w-16 px-3 py-2 bg-muted border border-border rounded-lg border-pink-500"
                                min="1"
                            />
                            <span className="ml-2 text-sm">minute(s)</span>
                        </div>

                        {/* Afficher la durée seulement si ce n'est pas Death By */}
                        {!isDeathBy && (
                            <div className='flex justify-center items-center mb-3'>
                                <label className="text-lg font-medium mr-2">pendant</label>
                                <input
                                    type="number"
                                    value={config.duration}
                                    onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                                    className="w-16 px-3 py-2 bg-muted border border-border rounded-lg border-pink-500"
                                    min="1"
                                />
                                <span className="ml-2 text-sm">minute(s)</span>
                            </div>
                        )}

                        {/* Badge pour indiquer le mode Death By actif */}
                        {isDeathBy && (
                            <motion.div
                                className='flex justify-center items-center mb-3'
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className='px-3 py-1.5 bg-pink-500/20 border border-pink-500 rounded-full text-sm flex items-center gap-2'>
                                    <InfinityIcon className="w-4 h-4" />
                                    <span>Mode Death By</span>
                                    <motion.button
                                        onClick={() => setIsDeathBy(false)}
                                        className="ml-1 hover:bg-pink-500/30 rounded-full p-0.5"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X className="w-3 h-3" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Boutons seulement si pas en mode Death By et pas de round ajouté */}
                        {!isDeathBy && !emomRound && (
                            <motion.div
                                className='flex justify-center items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors py-2'
                                onClick={addEmomRound}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <CirclePlus className="w-4 h-4 mr-2" />
                                Ajoute des réglages (facultatif)
                            </motion.div>
                        )}

                        {!isDeathBy && !emomRound && (
                            <motion.div
                                className='flex justify-center items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors py-2'
                                onClick={() => setIsDeathBy(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <InfinityIcon className="w-4 h-4 mr-2" />
                                Aussi longtemps que possible ('Death by')
                            </motion.div>
                        )}

                        {emomRound ? (
                            <motion.div

                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card className='my-1 p-3'>
                                    <div className='flex items-center justify-between'>
                                        <motion.button
                                            className="p-1 hover:bg-accent rounded transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={removeEmomRound}
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>

                                    <div className='flex items-center mb-2'>
                                        <input
                                            type="number"
                                            value={emomRound.round}
                                            onChange={(e) => updateEmomRound('round', parseInt(e.target.value))}
                                            className="mx-2 ml-2 px-3 py-1.5 bg-muted border border-border rounded-lg w-16  border-pink-500"
                                            min="1"
                                        />
                                        <span className='text-sm'>Séries</span>
                                    </div>

                                    <div className='flex items-center'>
                                        <input
                                            type="number"
                                            value={emomRound.rest}
                                            onChange={(e) => updateEmomRound('rest', parseInt(e.target.value))}
                                            className="mx-2 ml-2 px-3 py-1.5 bg-muted border border-border rounded-lg w-16  border-pink-400"
                                            min="0"
                                        />
                                        <span className='text-sm'>minutes de récupération</span>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : null}

                    </>
                )
            case 'FOR_TIME':
                return (
                    <>
                        <div className='text-center mb-2'>
                            <label className="text-sm font-medium">Aussi vite que possible</label>
                        </div>

                        {/* Afficher le time cap seulement si pas en mode No Time Cap */}
                        {!noTimeCap && (
                            <div className='flex justify-center items-center mb-3'>
                                <label className="text-sm font-medium mr-2">Temps limite :</label>
                                <input
                                    type="number"
                                    value={config.timeCap}
                                    onChange={(e) => setConfig({ ...config, timeCap: parseInt(e.target.value) })}
                                    className="w-16 px-3 py-2 bg-muted border border-border rounded-lg border-green-500"
                                    min="1"
                                />
                                <span className="ml-2 text-sm">minute(s)</span>
                            </div>
                        )}

                        {/* Badge pour indiquer le mode No Time Cap actif */}
                        {noTimeCap && (
                            <motion.div
                                className='flex justify-center items-center mb-3'
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className='px-3 py-1.5 bg-green-500/20 border border-green-500 rounded-full text-sm flex items-center gap-2'>
                                    <InfinityIcon className="w-4 h-4" />
                                    <span>Pas de limite de temps</span>
                                    <motion.button
                                        onClick={() => setNoTimeCap(false)}
                                        className="ml-1 hover:bg-green-500/30 rounded-full p-0.5"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X className="w-3 h-3" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Bouton pour activer le mode No Time Cap */}
                        {!noTimeCap && (
                            <motion.div
                                className='flex justify-center items-center cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors py-2'
                                onClick={() => setNoTimeCap(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <InfinityIcon className="w-4 h-4 mr-2" />
                                Pas de limite de temps
                            </motion.div>
                        )}
                    </>
                )

        }
    }

    const getTimerTitle = () => {
        switch (timerType) {
            case 'TABATA': return 'Tabata'
            case 'AMRAP': return 'AMRAP'
            case 'EMOM': return 'EMOM'
            case 'FOR_TIME': return 'For Time'
        }
    }

    return (
        <motion.div
            className="bg-background border border-border rounded-2xl shadow-2xl p-4 w-80"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={onBack}
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </motion.button>
                    <h3 className="font-bold text-lg">{getTimerTitle()}</h3>
                </div>
                <motion.button
                    onClick={onClose}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Config fields */}
            <div className="space-y-3 mb-4">
                {renderConfig()}
            </div>

            {/* Start button */}
            <motion.button
                onClick={handleStart}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 cursor"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Play className="w-5 h-5" />
                Démarrer
            </motion.button>
        </motion.div>
    )
}
