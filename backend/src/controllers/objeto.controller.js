import * as objetoService from '../services/objeto.services.js';

export const obtenerObjetosPendientes = async (req, res) => {
    try {
        const pendingObjects = await objetoService.obtenerObjetosPendientes();
        res.status(200).json(pendingObjects);
    } catch (error) {
        console.error('Error al obtener los objetos pendientes:', error);
        res.status(500).json({ error: 'Error al obtener los objetos pendientes' });
    }
};

export const crearObjeto = async (req, res) => {
    try {
        const nuevoObjeto = await objetoService.crearObjeto(req.body);
        res.status(201).json(nuevoObjeto);
    } catch (error) {
        console.error('Error al crear el objeto:', error);
        res.status(500).json({ error: 'Error al crear el objeto' });
    }
};

export const listarPuntosEntrega = async (req, res) => {
    try {
        const puntosEntrega = await objetoService.listarPuntosEntrega();
        res.status(200).json(puntosEntrega);
    } catch (error) {
        console.error('Error al listar los puntos de entrega:', error);
        res.status(500).json({ error: 'Error al listar los puntos de entrega' });
    }
};