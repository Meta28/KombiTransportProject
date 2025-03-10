import Client from '../models/client.js';

const clientController = {
  getClients: (req, res) => {
    const userId = req.user.id;
    Client.findByUserId(userId, (err, clients) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching clients', details: err.message });
      }
      res.json(clients);
    });
  },
  createClient: (req, res) => {
    const userId = req.user.id;
    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    Client.create({ user_id: userId, name, address }, (err, client) => {
      if (err) {
        return res.status(500).json({ error: 'Error creating client', details: err.message });
      }
      res.status(201).json(client);
    });
  },
  updateClient: (req, res) => {
    const clientId = req.params.id;
    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    Client.update(clientId, { name, address }, (err, updatedClient) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating client', details: err.message });
      }
      res.json(updatedClient);
    });
  },
  deleteClient: (req, res) => {
    const clientId = req.params.id;
    Client.delete(clientId, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting client', details: err.message });
      }
      res.json({ message: 'Client deleted' });
    });
  },
};

export default clientController;