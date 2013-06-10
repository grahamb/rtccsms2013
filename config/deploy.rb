set :application,   "rtccsms2013"
set :repository,    "git@github.com:grahamb/rtccsms2013.git"
set :branch,        "master"
set :scm,           :git
set :user,          "nodeuser"
set :deploy_via,    :remote_cache
set :deploy_to,     "/var/nodeapps/rtccsms2013"
set :use_sudo,      false

default_run_options[:pty] = true
ssh_options[:paranoid] = false
ssh_options[:keys] = [File.join(ENV["HOME"], ".ssh", "id_rsa")]

role :app, "node-stage.its.sfu.ca"
set :node_env, "production"


# this tells capistrano what to do when you deploy
namespace :deploy do

  desc <<-DESC
  A macro-task that updates the code and fixes the symlink.
  DESC
  task :default do
    transaction do
      update_code
      node.node_modules_symlink
      node.npminstall
      symlink
    end
  end

    task :update_code, :except => { :no_release => true } do
        on_rollback { run "rm -rf #{release_path}; true" }
        strategy.deploy!
    end

    task :restart do
        find_servers_for_task(current_task).each do |server|
            run_locally "ssh #{user}@#{server} /etc/init.d/rtccsms2013 restart"
        end
    end

end

namespace :node do

    desc "Create node_modules symlink"
    task :node_modules_symlink do
        run "cd #{latest_release} && ln -s #{shared_path}/node_modules node_modules"
    end

    desc "Install node modules with npm"
    task :npminstall do
        run "cd #{latest_release} && npm install"
    end

    desc "Copy config.json from shared"
    task :copyconfig do
        run "cp #{shared_path}/config.json #{release_path}"
    end
end

after(:deploy, "deploy:restart")
after "deploy:restart", "deploy:cleanup"
