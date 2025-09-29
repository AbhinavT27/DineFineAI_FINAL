
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <h3 className="text-white text-xl font-bold">DineFine</h3>
            </div>
            <p className="text-slate-400 mb-4">
              Your premier destination for exceptional dining experiences and seamless restaurant reservations.
            </p>
            <div className="flex space-x-4">
              <Instagram className="h-5 w-5 hover:text-orange-400 cursor-pointer transition-colors" />
              <Facebook className="h-5 w-5 hover:text-orange-400 cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 hover:text-orange-400 cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-400 transition-colors">Find Restaurants</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Make Reservation</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Gift Cards</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <span className="text-sm">123 Culinary Street, NY 10001</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-orange-400" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-orange-400" />
                <span className="text-sm">hello@dinefine.com</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400">
            © 2024 DineFine. All rights reserved. Crafted with passion for exceptional dining.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
