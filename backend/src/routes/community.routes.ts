import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Idea from '../models/idea.model';
import Resource, { ResourceType } from '../models/resource.model';
import { auth } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Ideas Routes
router.get('/ideas', async (req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch ideas from MongoDB...');
    const ideas = await Idea.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Ideas fetched successfully:', ideas);
    res.json(ideas);
  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Error fetching ideas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/ideas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const deletedIdea = await Idea.findByIdAndDelete(id);
    
    if (!deletedIdea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    console.log('Idea deleted successfully:', deletedIdea);
    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Error deleting idea',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/ideas', auth, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Received idea creation request:', req.body);
    
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const idea = new Idea({
      title,
      description,
      author: req.user?.id
    });

    console.log('Attempting to save idea:', idea);
    const savedIdea = await idea.save();
    const populatedIdea = await savedIdea.populate('author', 'name');
    console.log('Idea saved successfully:', populatedIdea);

    res.status(201).json(populatedIdea);
  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Error creating idea',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Resources Routes
router.get('/resources', async (req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch resources from MongoDB...');
    const resources = await Resource.find()
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Resources fetched successfully:', resources);
    res.json(resources);
  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Error fetching resources',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/resources', auth, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Received resource creation request:', req.body);
    
    const { title, description, resourceType, url } = req.body;

    // Validate required fields
    if (!title || !description || !resourceType || !url) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          title: !title ? 'Title is required' : null,
          description: !description ? 'Description is required' : null,
          resourceType: !resourceType ? 'Resource type is required' : null,
          url: !url ? 'URL is required' : null
        }
      });
    }

    // Validate resource type
    const validTypes = ['PDF', 'VIDEO', 'TOOL'];
    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({ 
        message: 'Invalid resource type',
        details: `Resource type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ 
        message: 'Invalid URL format',
        details: 'Please provide a valid URL (e.g., https://example.com)'
      });
    }

    const resource = new Resource({
      title: title.trim(),
      description: description.trim(),
      resourceType,
      url: url.trim(),
      addedBy: req.user?.id
    });

    console.log('Attempting to save resource:', resource);
    const savedResource = await resource.save();
    const populatedResource = await savedResource.populate('addedBy', 'name');
    console.log('Resource saved successfully:', populatedResource);

    res.status(201).json(populatedResource);
  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Error creating resource',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 