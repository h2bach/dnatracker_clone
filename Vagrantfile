# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

    config.vm.box = "dna-tracker-box"
    config.vm.network "private_network", ip: "192.168.33.10"
    config.vm.hostname = "dna-tracker-box"
    config.vm.synced_folder ".", "/var/www", :mount_options => ["dmode=777", "fmode=777"]
    
    # Optional NFS. Make sure to remove other synced_folder line too
    #config.vm.synced_folder ".", "/var/www", :nfs => { :mount_options => ["dmode=777","fmode=666"] }

end
