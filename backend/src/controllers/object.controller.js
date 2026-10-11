import * as objectService from '../services/object.services.js';

export const getPendingObjects = async (req, res) => {
    try {
        const pendingObjects = await objectService.getPendingObjects();
        res.status(200).json(pendingObjects);
    } catch (error) {
        console.error('Error al obtener los objetos pendientes:', error);
        res.status(500).json({ error: 'Error al obtener los objetos pendientes' });
    }
};